# Core self-host image. Sandbox and Agent Store packages are intentionally absent.
# Build from a clean checkout that already has Git LFS objects:
#   docker build -f deploy/Dockerfile -t exec-daemon-core:local .
FROM ubuntu:24.04

ARG NODE_TOOLING_VERSION=22.20.0
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    xz-utils \
  && rm -rf /var/lib/apt/lists/* \
  && curl -fsSL "https://nodejs.org/dist/v${NODE_TOOLING_VERSION}/node-v${NODE_TOOLING_VERSION}-linux-x64.tar.xz" \
    | tar -xJ -C /usr/local --strip-components=1 \
  && node --version

WORKDIR /src
COPY package.json package-lock.json tsconfig.json ./
COPY src src
COPY tools tools
COPY runtime runtime
COPY runtime-tools runtime-tools
COPY bin bin
COPY vendor vendor

RUN npm ci --ignore-scripts --no-audit --no-fund \
  && node --experimental-strip-types tools/compile.ts \
  && node dist/project/tools/build.js \
  && node dist/project/tools/provision-runtime-tools.js --profile core \
  && node dist/project/tools/verify-build.js \
  && useradd --create-home --uid 1010 --shell /usr/sbin/nologin exec \
  && mkdir -p /opt/exec-daemon \
  && cp -a bin /opt/exec-daemon/bin \
  && mkdir -p /opt/exec-daemon/dist \
  && cp -a dist/runtime /opt/exec-daemon/dist/runtime \
  && chown -R exec:exec /opt/exec-daemon

COPY deploy/entrypoint.sh /opt/exec-daemon/entrypoint.sh
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfreetype6 \
    libavcodec60 \
    libavdevice60 \
    libavformat60 \
    libavutil58 \
    libswscale7 \
  && rm -rf /var/lib/apt/lists/* \
  && chmod 755 /opt/exec-daemon/entrypoint.sh /opt/exec-daemon/bin/exec-daemon

USER exec
WORKDIR /workspace
ENV CURSOR_EXEC_DAEMON_DATA_DIR=/data \
    HOME=/home/exec \
    PATH="/opt/exec-daemon/dist/runtime:${PATH}"
ENTRYPOINT ["/opt/exec-daemon/entrypoint.sh"]
