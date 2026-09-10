---
title: "Detecting Linux Hardening Drift Without a Full Configuration-Management Stack"
date: 2026-09-10
description: "A practical, read-only workflow for detecting changes to a Linux hardening baseline before configuration drift becomes an incident."
tags: ["linux", "hardening", "security", "sysadmin", "configuration-drift"]
categories: ["guides"]
author: "Mohammad Hossein Asgari Somarin"
author_bio: "IT and infrastructure specialist focused on network engineering, Linux and Windows administration, infrastructure security, hardening and practical IT operations."
author_link: "https://mowhmmdh.github.io/"
draft: true
---

# Detecting Linux Hardening Drift Without a Full Configuration-Management Stack

A hardening baseline is not a permanent state. An administrator opens a port for an emergency, a package enables a service, an SSH setting is changed during troubleshooting, or a firewall rule is added and never removed. The server can remain healthy while quietly moving away from the state that was reviewed and approved.

A full configuration-management system is the right answer once a fleet becomes large enough to need continuous enforcement. Smaller teams still need a way to notice drift before it becomes an incident.

This guide describes a deliberately small approach: define a baseline, collect read-only evidence, compare it with the expected state, investigate differences, and move mature controls into configuration management when the process outgrows shell checks.

> **Scope:** The examples below target Ubuntu 24.04 LTS. Do not run them unchanged on production systems until they have been tested against the exact image, packages and access model in use.

## 1. Define what “hardened” means

Do not start with a giant checklist. Start with a small set of states that matter operationally.

A useful first baseline can include:

- SSH authentication and root-login policy.
- Expected listening sockets.
- Firewall state and expected exposed ports.
- Enabled services.
- Automatic security-update configuration.
- AppArmor enforcement state.
- Time synchronisation.
- Privileged local accounts.
- A small set of security-sensitive configuration files.

The baseline should be versioned. If nobody can answer “what was the expected state on this host?”, a drift check has nothing meaningful to compare against.

## 2. Capture evidence, not secrets

A drift check should collect the minimum information needed to answer whether the host changed.

Start with simple read-only commands:

```bash
ss -lntup
systemctl --type=service --state=enabled --no-pager
sudo ufw status verbose
systemctl is-enabled unattended-upgrades 2>/dev/null || true
systemctl is-active apparmor 2>/dev/null || true
sudo aa-status 2>/dev/null || true
timedatectl status
getent group sudo
```

The exact output varies by installation. The purpose is not to create a universal parser; it is to make the expected state explicit enough that an operator can review changes.

Do not automatically archive passwords, private keys, full environment files, application secrets or unrestricted logs as “evidence”. A security control that creates a second sensitive-data repository can make the overall system worse.

## 3. Check SSH policy explicitly

SSH is one of the most important places to detect drift because a small configuration change can alter remote access immediately.

Inspect the effective configuration rather than assuming the main configuration file tells the whole story:

```bash
sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication|pubkeyauthentication|allowgroups|authenticationmethods) '
```

Record the values that are actually approved for the host role.

For example, a team might decide that a production Linux host should have root SSH login disabled and public-key authentication enabled. The exact policy is environment-specific; the important part is that the expected values are explicit and reviewable.

If the command reports a change, investigate the source before automatically overwriting it. Drop-in files and package updates can change effective configuration without editing the file an operator normally checks.

## 4. Compare listening sockets with the approved surface

A server can drift simply because a package or administrator starts a new daemon.

Capture the current TCP/UDP listening surface:

```bash
sudo ss -lntup
```

Then compare it with a small role-based baseline.

For example, a reverse proxy host might intentionally expose HTTPS while an internal database host may have no public listener at all. The same “expected ports” file should not be applied to every server.

A useful baseline records at least:

- protocol;
- local address;
- port;
- owning service;
- reason the listener is required.

A new listener should produce an investigation item, not an automatic firewall change.

## 5. Treat firewall rules as configuration

The firewall is another place where emergency changes become permanent.

For UFW-based hosts:

```bash
sudo ufw status numbered
```

Keep the expected rules in a version-controlled baseline. When a new allow rule appears, ask:

1. Who requested it?
2. What service requires it?
3. Is the source range appropriately restricted?
4. Is the rule temporary or permanent?
5. Is the corresponding application listener still required?

Do not confuse “the port is blocked by the firewall” with “the service is unnecessary”. Unneeded services should still be removed or disabled where appropriate.

## 6. Detect changes to security-sensitive files

A simple checksum manifest can provide a useful tripwire for a small host.

For example:

```bash
sudo sha256sum \
  /etc/ssh/sshd_config \
  /etc/ssh/sshd_config.d/*.conf \
  /etc/login.defs \
  /etc/sysctl.conf \
  /etc/ufw/user.rules \
  /etc/ufw/user6.rules
```

The list must match the actual files present on the host. Missing optional files should be handled deliberately rather than hidden by a broad wildcard.

A checksum change does not prove that a configuration became insecure. It proves that the bytes changed. The next step is review.

For higher-value systems, keep the approved manifest outside the host being monitored. Otherwise an attacker who gains sufficient privileges to modify the configuration can also modify the evidence used to detect the change.

## 7. Check privileged accounts

Local privileged access should be explainable.

For a first-pass review:

```bash
getent group sudo
sudo awk -F: '($3 == 0) {print $1}' /etc/passwd
```

On systems using another administrative group, adapt the check to the local policy.

The output should be compared against an approved list or identity-management source. Avoid automatically deleting accounts based only on a difference: emergency accounts, break-glass procedures and centrally managed identities need an explicit workflow.

## 8. Turn checks into a read-only report

The first useful automation is often not remediation. It is a report that tells an operator what changed.

A small wrapper can collect the checks above into a timestamped directory:

```bash
set -eu

OUT="/var/log/hardening-drift"
sudo install -d -m 0750 "$OUT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
FILE="$OUT/$STAMP.txt"

{
  echo "# Host: $(hostname -f)"
  echo "# UTC: $(date -u --iso-8601=seconds)"
  echo
  echo "## SSH effective policy"
  sshd -T | grep -E '^(permitrootlogin|passwordauthentication|pubkeyauthentication|allowgroups|authenticationmethods) ' || true
  echo
  echo "## Listening sockets"
  ss -lntup || true
  echo
  echo "## Enabled services"
  systemctl --type=service --state=enabled --no-pager || true
  echo
  echo "## Firewall"
  ufw status numbered || true
  echo
  echo "## AppArmor"
  aa-status 2>/dev/null || true
  echo
  echo "## Time"
  timedatectl status || true
} | sudo tee "$FILE" >/dev/null

sudo chmod 0640 "$FILE"
```

This is intentionally simple. A production implementation should define retention, ownership, storage location and access controls before scheduling it.

Do not treat local reports as tamper-proof security logs. For important systems, forward the relevant security events to a separately protected logging system.

## 9. Separate expected change from unexplained change

A useful drift process has three states:

- **Expected:** documented change with an owner and reason.
- **Investigate:** change exists but its source or purpose is unclear.
- **Incident:** evidence suggests unauthorised access, malicious modification or material security impact.

This distinction prevents two common failures: ignoring all changes because “admins make changes”, and automatically reverting legitimate emergency work.

The report should therefore be tied to change records, maintenance windows or another lightweight operational record where possible.

## 10. Know when shell checks are no longer enough

A small number of hosts can be monitored with carefully scoped checks. That does not mean shell scripts should become an unofficial configuration-management platform.

Move controls into Ansible, another configuration-management system, or an equivalent enforcement mechanism when you need capabilities such as:

- repeatable remediation;
- fleet-wide policy enforcement;
- role-based configuration;
- controlled secrets handling;
- versioned deployments;
- compliance evidence at scale;
- reliable rollback.

The goal of a drift check is to expose the point where the operational process is losing control, not to hide that problem behind a larger script.

## What this guide deliberately does not cover

This guide does not attempt to provide a universal Linux hardening baseline, a compliance certification method, an intrusion-detection system, or a replacement for configuration management.

It also does not prescribe a single SSH policy, firewall policy or account model for every environment. Those decisions depend on the host role, threat model, identity architecture and operational requirements.

The practical objective is narrower: make important hardening assumptions explicit, detect when they change, and give an operator a safe path from a one-time baseline toward continuous enforcement.
