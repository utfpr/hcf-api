# Ansible

## Getting started

- [Install Ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html#pipx-install)
- Add the following collections to your Ansible installation
  - `ansible-galaxy collection install ansible.posix`
  - `ansible-galaxy collection install community.mysql`

## Setup

You don't need to follow this step unless you're setting Ansible in the server for the first time.

Run the following command replacing the necessary values between angle brackets if necessary.

- *The user replaced in `<user>` needs sudo access*

```shell
ansible-playbook --user <user> --key-file <ssh private key path> --ask-become-pass playbooks/01_bootstrap.yml
```
