import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from tests.conftest import API

SECRET = "secreto-de-prueba"


@pytest.fixture
def proxy_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(get_settings(), "proxy_secret", SECRET)


@pytest.mark.parametrize("headers", [{}, {"X-Proxy-Secret": "otro"}])
def test_requests_without_the_proxy_secret_are_rejected(
    client: TestClient, proxy_secret: None, headers: dict
) -> None:
    for path in (f"{API}/products", "/docs", "/openapi.json"):
        assert client.get(path, headers=headers).status_code == 403


def test_requests_with_the_proxy_secret_pass(client: TestClient, proxy_secret: None) -> None:
    assert client.get(f"{API}/products", headers={"X-Proxy-Secret": SECRET}).status_code == 200


def test_health_check_does_not_need_the_secret(client: TestClient, proxy_secret: None) -> None:
    assert client.get("/health").status_code == 200


def test_without_a_configured_secret_nothing_is_checked(client: TestClient) -> None:
    assert client.get(f"{API}/products").status_code == 200
