# syntax=docker/dockerfile:1
# Static musl build in a small image:
#   docker build -t spotweb .
#   docker run -d -p 6000:6000 -e API_TOKEN=... -v spotweb-data:/data spotweb
#
# Released images are published to ghcr.io/hexagon/spotweb (see docs/deployment.md). The release workflow
# builds them with `--build-arg BIN=prebuilt`, which packages the signed release binaries from
# dist/<arch>/spotweb instead of compiling again.

# Where the binary comes from: `build` (compile from source, default) or `prebuilt`
ARG BIN=build

FROM rust:1-alpine AS build
RUN apk add --no-cache musl-dev
WORKDIR /src
# Dependencies first, in their own layer: with only Cargo.toml/Cargo.lock and a dummy main, this layer is
# reused until the dependencies change, so a code change only recompiles spotweb itself
COPY Cargo.toml Cargo.lock ./
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    mkdir src && echo 'fn main() {}' > src/main.rs \
    && cargo build --release --locked \
    && rm -rf src
COPY src src
COPY templates templates
COPY static static
COPY locales locales
# COPY keeps the files' mtimes, which can be older than the dummy build: touch so cargo rebuilds spotweb
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    touch src/main.rs && cargo build --release --locked && strip target/release/spotweb && cp target/release/spotweb /spotweb

FROM scratch AS prebuilt
ARG TARGETARCH
COPY dist/${TARGETARCH}/spotweb /spotweb

FROM ${BIN} AS bin

FROM alpine:3
RUN apk add --no-cache ca-certificates tzdata && adduser -D -H -u 10001 spotweb && mkdir /data && chown spotweb /data
COPY --from=bin --chmod=755 /spotweb /usr/local/bin/spotweb
USER spotweb
WORKDIR /data
ENV SPOTWEB_DB=/data/spotweb.db SPOTWEB_PORT=6000 SPOTWEB_BIND=0.0.0.0
EXPOSE 6000
VOLUME /data
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:6000/healthz || exit 1
ENTRYPOINT ["/usr/local/bin/spotweb"]
CMD ["serve"]
