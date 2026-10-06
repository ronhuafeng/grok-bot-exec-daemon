# Core self-host image. Sandbox and Agent Store packages are intentionally absent.
# Input reproducibility is pinned here; this is not a bit-for-bit OCI image claim.
#   docker build -f deploy/Dockerfile -t exec-daemon-core:local .
FROM ubuntu:24.04@sha256:534baea6a22c03a63003dbc8dbe78fe34bc0d7e595d9a9dc9834884ff530eb55

ARG NODE_TOOLING_VERSION=22.20.0
ARG NODE_TOOLING_SHA256=00bbd05e306ea68b6e13e17360d0e2f680b493ef95f2fea1c4296ff7437530bc
ARG APT_SNAPSHOT=20261001T000000Z
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && printf 'deb https://snapshot.ubuntu.com/ubuntu/%s noble main universe\ndeb https://snapshot.ubuntu.com/ubuntu/%s noble-updates main universe\ndeb https://snapshot.ubuntu.com/ubuntu/%s noble-security main universe\n' \
    "$APT_SNAPSHOT" "$APT_SNAPSHOT" "$APT_SNAPSHOT" > /etc/apt/sources.list \
  && rm -f /etc/apt/sources.list.d/* \
  && apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates=20260601~24.04.1 \
    curl=8.5.0-2ubuntu10.15 \
    git=1:2.43.0-1ubuntu7.3 \
    xz-utils=5.6.1+really5.4.5-1ubuntu0.3 \
  && rm -rf /var/lib/apt/lists/* \
  && curl -fsSL "https://nodejs.org/dist/v${NODE_TOOLING_VERSION}/node-v${NODE_TOOLING_VERSION}-linux-x64.tar.xz" -o /tmp/node.tar.xz \
  && echo "${NODE_TOOLING_SHA256}  /tmp/node.tar.xz" | sha256sum -c - \
  && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
  && rm /tmp/node.tar.xz \
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
    libfreetype6=2.13.2+dfsg-1ubuntu0.1 \
    libavcodec60=7:6.1.1-3ubuntu5 \
    libavdevice60=7:6.1.1-3ubuntu5 \
    libavformat60=7:6.1.1-3ubuntu5 \
    libavutil58=7:6.1.1-3ubuntu5 \
    libswscale7=7:6.1.1-3ubuntu5 \
  && rm -rf /var/lib/apt/lists/* \
  && chmod 755 /opt/exec-daemon/entrypoint.sh /opt/exec-daemon/bin/exec-daemon

USER exec
WORKDIR /workspace
ENV CURSOR_EXEC_DAEMON_DATA_DIR=/data \
    HOME=/home/exec \
    PATH="/opt/exec-daemon/dist/runtime:${PATH}"
ENTRYPOINT ["/opt/exec-daemon/entrypoint.sh"]
