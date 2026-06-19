# e2e, Playwright full-stack tests

Browser tests across both public sites + the admin, **desktop and mobile**, against a real
backend + MariaDB (mirrors the Harry List e2e harness: backend seed/reset fixtures, Mailpit for
form emails, evidence capture).

## Coverage map

| Module | Public (Hubble) | Public (Meteor) | Admin CRUD | Mobile |
|--------|-----------------|-----------------|------------|--------|
| Shell / nav / static pages | ⬜ | ⬜ | n/a | ⬜ |
| Menu | ⬜ | ⬜ | ⬜ | ⬜ |
| Daily dinner dish | ⬜ | n/a | ⬜ | ⬜ |
| Opening hours (+ status banner) | ⬜ | ⬜ | ⬜ | ⬜ |
| Events | ⬜ | ⬜ | ⬜ | ⬜ |
| Board (current / previous / supervisory) | ⬜ | ⬜ | ⬜ | ⬜ |
| Vacancies | ⬜ | n/a | ⬜ | ⬜ |
| Associations | ⬜ | n/a | ⬜ | ⬜ |
| Roles / read-only viewer / DDD poster | n/a | n/a | ⬜ | ⬜ |
| Forms (contact / tips / …) | ⬜ | ⬜ | n/a | ⬜ |

Legend: ⬜ not yet · 🟡 partial · ✅ covered. Update this table as specs land.

_Scaffolded in a later step._
