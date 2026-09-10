Subject: Guest pitch — Detecting Linux hardening drift without a full configuration-management stack

Hi Paul,

I’d like to pitch a practical ops guide for StackHarden: “Detecting Linux Hardening Drift Without a Full Configuration-Management Stack”.

Audience: sysadmins and small infrastructure teams running a handful of Ubuntu/Debian servers.

The problem: a hardening baseline is useful at build time, but small teams often have no continuous configuration-management system. Packages change, services get enabled, SSH policy gets edited, firewall rules drift, and an emergency fix can quietly weaken the original baseline. The guide would show how to turn a one-time hardening baseline into a lightweight, reviewable drift-detection routine without pretending that shell checks replace configuration management.

The piece would cover:

- Defining a small, explicit hardening baseline worth checking.
- Snapshotting evidence for SSH, listening sockets, firewall state, enabled services, automatic security updates, AppArmor, time sync and privileged accounts.
- Comparing current state with an approved baseline using simple shell tools and checksums.
- Separating expected operational changes from unexplained drift.
- Scheduling read-only checks and storing results without collecting unnecessary sensitive data.
- Escalation and rollback: when to investigate, when to restore, and when to move the control into Ansible or another enforcement system.
- A “What this guide deliberately does not cover” section to keep the scope tight.

I would target Ubuntu 24.04 LTS for the primary examples and explicitly label the draft as untested until each command has been run against that version. I can provide the complete Markdown draft after a pitch green-light.

For writing samples, my technical knowledge base covers Linux hardening, network hardening, infrastructure security and GitLab CI/CD:
https://mowhmmdh.github.io/blog/linux-server-hardening-checklist.html
https://mowhmmdh.github.io/blog/network-hardening.html

Best,
Mohammad Hossein Asgari Somarin
