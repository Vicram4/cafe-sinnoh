import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.stored_file import StoredFile
from tests.conftest import API

APPLICATIONS = f"{API}/careers/applications"
VALID_PDF = b"%PDF-1.4\n% CV de prueba\n%%EOF\n"
FORM = {
    "full_name": "Candidata de Prueba",
    "email": "candidata@example.com",
    "phone": "600000000",
    "position": "BARISTA",
    "experience": "Dos años en cafetería.",
}


def _apply(client: TestClient, cv: tuple | None = None):
    files = {"cv": cv} if cv else None
    return client.post(APPLICATIONS, data=FORM, files=files)


def test_application_without_cv_is_accepted(client: TestClient) -> None:
    response = _apply(client)

    assert response.status_code == 201
    assert response.json()["has_cv"] is False
    assert response.json()["cv_original_name"] is None


def test_application_with_valid_pdf_stores_it_in_the_database_under_a_generated_key(
    client: TestClient, db: Session
) -> None:
    response = _apply(client, ("Currículum José.pdf", VALID_PDF, "application/pdf"))

    assert response.status_code == 201
    body = response.json()
    assert body["has_cv"] is True
    assert body["cv_original_name"] == "Currículum José.pdf"
    assert "cv_storage_key" not in body

    stored = db.scalars(select(StoredFile)).all()
    assert len(stored) == 1
    assert stored[0].key != "Currículum José.pdf"
    assert stored[0].content == VALID_PDF


@pytest.mark.parametrize(
    ("cv", "expected_status"),
    [
        (("cv.pdf", b"esto no es un pdf", "application/pdf"), 415),  # firma incorrecta
        (("cv.pdf", VALID_PDF, "text/plain"), 415),  # content-type incorrecto
        (("cv.docx", VALID_PDF, "application/pdf"), 415),  # extensión incorrecta
        (("cv.pdf", b"", "application/pdf"), 400),  # vacío
    ],
)
def test_invalid_cv_is_rejected_and_no_application_is_created(
    client: TestClient, db: Session, admin_headers: dict, cv: tuple, expected_status: int
) -> None:
    response = _apply(client, cv)

    assert response.status_code == expected_status
    assert client.get(APPLICATIONS, headers=admin_headers).json() == []
    assert db.scalar(select(func.count()).select_from(StoredFile)) == 0


def test_cv_larger_than_the_limit_is_rejected(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(get_settings(), "cv_max_bytes", len(VALID_PDF) - 1)

    response = _apply(client, ("cv.pdf", VALID_PDF, "application/pdf"))

    assert response.status_code == 413


def test_missing_required_field_returns_422(client: TestClient) -> None:
    data = {key: value for key, value in FORM.items() if key != "phone"}

    response = client.post(APPLICATIONS, data=data)

    assert response.status_code == 422


def test_admin_downloads_the_original_cv(client: TestClient, admin_headers: dict) -> None:
    application_id = _apply(client, ("Currículum José.pdf", VALID_PDF, "application/pdf")).json()["id"]

    response = client.get(f"{APPLICATIONS}/{application_id}/cv", headers=admin_headers)

    assert response.status_code == 200
    assert response.content == VALID_PDF
    assert response.headers["content-type"] == "application/pdf"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert "Curr%C3%ADculum%20Jos%C3%A9.pdf" in response.headers["content-disposition"]


def test_download_of_application_without_cv_returns_404(client: TestClient, admin_headers: dict) -> None:
    application_id = _apply(client).json()["id"]

    response = client.get(f"{APPLICATIONS}/{application_id}/cv", headers=admin_headers)

    assert response.status_code == 404


def test_admin_listing_never_exposes_the_storage_key(client: TestClient, admin_headers: dict) -> None:
    _apply(client, ("cv.pdf", VALID_PDF, "application/pdf"))

    listing = client.get(APPLICATIONS, headers=admin_headers).json()

    assert listing[0]["has_cv"] is True
    assert "cv_storage_key" not in listing[0]
