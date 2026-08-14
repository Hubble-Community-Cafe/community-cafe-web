# Observability stack

Logs and container metrics for the whole server, in one Portainer stack: **Loki** (log store),
**Promtail** (shipper), **Prometheus** + **cAdvisor** (container metrics), and **geoipupdate**
(GeoLite2 databases for visitor geography).

Grafana is deliberately **not** in this stack. It runs separately and joins the shared
`observability` network to query Loki and Prometheus.

Everything here is log-based and cookieless: no script on any website, no third-party service,
no cookies, and the applications emit no personal data in their analytics events.

> **The compose file is not in this repo.** The stack is maintained directly in Portainer, and
> `docker-compose.portainer.yml` is gitignored. This README is the version-controlled record of
> how it is put together, what it collects and what the applications must do to feed it. If you
> change the stack, update this file to match.
>
> What this repo *does* own: the analytics lines the backend emits, and the container labels on
> the `backend` service that opt it into the pipeline (see "Opting a container in" below).

## What gets collected

| Job | Source | What it answers |
|-----|--------|-----------------|
| `npm` | Nginx Proxy Manager access logs | which sites are visited, how often, from where, on what device, and which URLs 404 |
| `app-analytics` | container stdout, label-discovered | business events: page views, form submissions, reservations |
| `containers` | all container stdout/stderr | ordinary application logs, for debugging |
| `cadvisor` (Prometheus) | Docker API | per-container CPU, memory, network and disk |

## Prerequisites

- The `observability` Docker network. Portainer > Networks > Add network, driver `bridge`.
- A free **MaxMind** account for the GeoLite2 databases (country and network owner for the `npm`
  job): sign up at https://www.maxmind.com/en/geolite2/signup and create a licence key.
- Nginx Proxy Manager on the same host with its data on the `base_nginx_data` named volume.

## Deploy

Portainer > **Stacks > Add stack > Web editor**, paste the stack definition, and add two stack
environment variables:

| Name | Value |
|------|-------|
| `MAXMIND_ACCOUNT_ID` | your account id |
| `MAXMIND_LICENSE_KEY` | your licence key |

Deploy. `loki-config-init` writes the configs and exits (expected), then `loki`, `promtail`,
`geoipupdate`, `cadvisor` and `prometheus` come up. Promtail may restart once while geoipupdate
downloads the databases.

Then point Grafana at it: add the `observability` network to the Grafana service, and add two data
sources, Loki at `http://loki:3100` and Prometheus at `http://prometheus:9090`.

Dashboards are intentionally not committed here. Build them in Grafana and export the JSON if you
want a backup.

## App analytics: the contract

Both backends emit **one PII-free logfmt line per business event** to stdout, prefixed
`APP_ANALYTICS`. Promtail keeps only those lines, strips the log prefix, and turns the key/value
pairs into Loki labels.

```
APP_ANALYTICS event=page_view page=menu bar=HUBBLE
APP_ANALYTICS event=form_submitted form=screen bar=BOTH
APP_ANALYTICS event=reservation_created bar=NO_PREFERENCE dow=7_Sun slot=2_afternoon guests=3_50_100 lead=3_wk3_4
APP_ANALYTICS event=reservation_status_changed status=CONFIRMED bar=HUBBLE
```

Labels (low cardinality, safe to group by): `event`, `bar`, `form`, `status`, `page`, plus `app`
and `container` from the container itself. The reservation buckets `dow`, `slot`, `guests` and
`lead` are stored as structured metadata instead, so they stay queryable without inflating the
index.

`bar` uses one shared uppercase vocabulary across every event and both services:

| Value | Meaning |
|-------|---------|
| `HUBBLE` / `METEOR` | the event belongs to that bar |
| `BOTH` | a poster shown on both screens (screen request form) |
| `NO_PREFERENCE` | the guest had no preference (reservations) |
| `NONE` | the event has no bar dimension (most forms) |
| `UNKNOWN` | the bar could not be determined (page view with no usable Origin) |

### Opting a container in

Only containers carrying these labels are scraped for analytics:

```yaml
    labels:
      analytics.scrape: "true"
      analytics.app: "community-cafe"    # or "harry-list"
```

`analytics.app` becomes the `app` label. It is set explicitly rather than derived from the
Compose project name so that renaming a stack cannot silently rename the dimension.

In this repo the labels live on the `backend` service in `docker-compose.portainer.template.yml`
and `docker-compose.yml`; the frontends emit nothing. `the-harry-list` needs the same two labels
on its backend and no stack config of its own: one Promtail on the host discovers every labelled
container regardless of which repo deployed it.

### Two things that are easy to get wrong

**The regex is anchored on `event=` on purpose.** The analytics logger is itself named
`APP_ANALYTICS`, so the string appears twice in every line (logger field, then message). An
unanchored `APP_ANALYTICS (.*)` captures the logger field and its padding instead of the payload.

**The log level must be pinned.** The `APP_ANALYTICS` logger sits outside the application package,
so it follows the root level. Both backends set `logging.level.APP_ANALYTICS=INFO` explicitly;
without it, setting `LOGGING_LEVEL_ROOT=WARN` in Portainer stops all analytics with no other
symptom.

## Notes and trade-offs

- **Docker socket.** Promtail mounts `/var/run/docker.sock` read-only to discover containers and
  read their logs. Read-only still means full read access to the daemon API, which is accepted here
  on a single-tenant host. The alternative is the Loki Docker logging driver, which needs no socket
  but moves configuration into every container.
- **The `containers` job is the volume driver.** It ingests every container's stdout at 90-day
  retention, far more than the analytics lines. Its drop rule is keyed on the Compose project name
  `observability`; if this stack is deployed under a different name in Portainer, **change that
  regex**, or Promtail and Loki will ingest their own output.
- **Retention** is 90 days for both Loki (`retention_period: 2160h`) and Prometheus. Watch disk.
- **Prometheus currently scrapes only cAdvisor.** Host-level metrics would need `node_exporter`, and
  application metrics would need the backend's `/actuator/prometheus` exposed and scraped.

## Troubleshooting

- **No analytics in Loki.** Check the container actually carries `analytics.scrape=true`
  (`docker inspect <container> --format '{{ .Config.Labels }}'`), then that Promtail can see the
  socket, then query `{job="app-analytics"}` in Grafana Explore with a wide time range.
- **Promtail crash-looping.** Almost always a config the init container wrote that Promtail cannot
  parse. Read `docker logs promtail`, then `docker run --rm -v <config-vol>:/c busybox cat
  /c/promtail-config.yml` to inspect what was actually written.
- **`npm` job empty.** Wrong volume name (underscores, not hyphens), or access logging disabled on
  the proxy hosts.
- **Everything reappears after a config change.** Promtail tracks read offsets in the
  `promtail-positions` volume; remove it to re-read from the start, and remove `loki-data` too if
  you want a clean slate.

## Note on NPM's log format

NPM 2.15.x logs each line as
`[time] <cache> <status> <upstream_status> - <method> <scheme> <host> "<uri>" [Client ip] [Length n] [Gzip g] [Sent-to s] "<ua>" "<ref>"`.
The `npm` job's regex matches that. If a future NPM changes it, Promtail will log parse failures;
line the capture groups up against a real log line and adjust.
