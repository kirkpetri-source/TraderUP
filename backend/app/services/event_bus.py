from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Dict, List


Subscriber = Callable[[dict[str, Any]], Awaitable[None]]


@dataclass
class Event:
    type: str
    payload: dict[str, Any]


class EventBus:
    def __init__(self) -> None:
        self._subscribers: Dict[str, List[Subscriber]] = {}
        self._lock = asyncio.Lock()

    async def publish(self, event: Event) -> None:
        async with self._lock:
            subscribers = list(self._subscribers.get(event.type, []))

        for subscriber in subscribers:
            await subscriber(event.payload)

    async def subscribe(self, event_type: str, callback: Subscriber) -> None:
        async with self._lock:
            self._subscribers.setdefault(event_type, []).append(callback)

    async def unsubscribe(self, event_type: str, callback: Subscriber) -> None:
        async with self._lock:
            if event_type in self._subscribers:
                self._subscribers[event_type] = [
                    cb for cb in self._subscribers[event_type] if cb != callback
                ]


event_bus = EventBus()
