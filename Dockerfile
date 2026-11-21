# Static musl build in a small image:
#   docker build -t spotweb .
#   docker run -d -p 6000:6000 -e API_TOKEN=... -v spotweb-data:/data spotweb
FROM rust:1-alpine AS build
RUN apk add --no-cache musl-dev
WORKDIR /src
COPY . .
RUN cargo build --release --locked && strip target/release/spotweb

FROM alpine:3
RUN apk add --no-cache ca-certificates tzdata && adduser -D -H -u 10001 spotweb && mkdir /data && chown spotweb /data
COPY --from=build /src/target/release/spotweb /usr/local/bin/spotweb
USER spotweb
WORKDIR /data
ENV SPOTWEB_DB=/data/spotweb.db SPOTWEB_PORT=6000 SPOTWEB_BIND=0.0.0.0
EXPOSE 6000
VOLUME /data
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:6000/healthz || exit 1
ENTRYPOINT ["/usr/local/bin/spotweb"]
CMD ["serve"]
