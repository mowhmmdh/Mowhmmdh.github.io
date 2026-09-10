---
title: "Linux Server Hardening Checklist: SSH, Firewall and Logging"
published: false
tags: linux, security, sysadmin, devops
canonical_url: https://mowhmmdh.github.io/en-blog/linux-server-hardening-checklist.html
---

# Linux Server Hardening Checklist: SSH, Firewall and Logging

Hardening is not a single command or a port change. It is a sequence of decisions that reduces attack surface while keeping administration and recovery practical.

## 1. Review accounts and privileges

Remove or disable unused accounts. Keep administrative access limited to people and services that actually need it. Separate normal administration from privileged operations where practical.

## 2. Treat SSH as a control plane

Prefer key-based authentication, restrict direct root access where practical, and control management access at the firewall or network layer. Changing the SSH port by itself is not a meaningful security boundary.

Before changing SSH configuration on a production server, keep an existing administrative session open and validate the effective configuration first.

## 3. Patch the operating system and exposed services

A hardened configuration does not compensate for an unpatched public service. Define a maintenance window, test important updates where possible, and keep a recovery path available.

## 4. Identify listening services

Use socket and service-management tools to identify what is actually exposed. Compare listening ports with the services the server is supposed to provide. Unexpected listeners should be investigated rather than blindly disabled.

## 5. Build firewall rules around requirements

Allow only required traffic and restrict management paths. Document important allow rules so a future administrator can distinguish intentional exposure from accidental exposure.

## 6. Make logging useful

Authentication events, important service failures and security-relevant changes should be observable. Retention should be long enough to investigate incidents, and logs should be protected from unauthorized modification.

## 7. Test recovery

A backup that has never been restored is an assumption, not a recovery plan. Test restoration of critical data and document the recovery procedure.

## A practical final checklist

- Accounts reviewed
- SSH access controlled
- Patching process defined
- Unnecessary services removed or disabled
- Firewall policy documented
- Security logging enabled
- Recovery tested

For a deeper technical baseline, see the original guide on [mowhmmdh.github.io](https://mowhmmdh.github.io/en-blog/linux-server-hardening-checklist.html).
