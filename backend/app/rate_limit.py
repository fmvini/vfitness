"""Small per-process sliding-window limit for abusive API traffic."""

from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import Request
from fastapi.responses import JSONResponse


class RateLimiter:
    def __init__(self) -> None:
        self.hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)
        self.lock = Lock()

    def check(self, key: tuple[str, str], limit: int, window: int = 60) -> int:
        now = monotonic()
        with self.lock:
            hits = self.hits[key]
            while hits and hits[0] <= now - window:
                hits.popleft()
            if len(hits) >= limit:
                return max(1, int(window - (now - hits[0])) + 1)
            hits.append(now)
            if len(self.hits) > 10000:
                self.hits = defaultdict(deque, {
                    item: times for item, times in self.hits.items()
                    if times and times[-1] > now - window
                })
        return 0


limiter = RateLimiter()


async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    if request.method == "OPTIONS" or path.startswith("/health"):
        return await call_next(request)

    client_ip = request.headers.get("x-vercel-forwarded-for", "").split(",")[0].strip()
    if not client_ip:
        client_ip = request.client.host if request.client else "unknown"
    category = "auth" if path in {"/auth/login", "/auth/register", "/auth/google"} else "api"
    limit = 10 if category == "auth" else 120
    retry_after = limiter.check((client_ip, category), limit)
    if retry_after:
        return JSONResponse(
            status_code=429,
            content={"detail": "Muitas solicitações. Aguarde um momento e tente novamente."},
            headers={"Retry-After": str(retry_after)},
        )
    return await call_next(request)
