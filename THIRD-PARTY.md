# Filter data attribution

The generated rules in ads.json, trackers.json and strict.json contain adaptations of EasyList and EasyPrivacy by the EasyList authors (https://easylist.to/). The adapted filter data is distributed under CC BY-SA 3.0 Unported (https://creativecommons.org/licenses/by-sa/3.0/). The starter rules are supplied separately in tools.

- EasyList https://easylist.to/easylist/easylist.txt — version 202611080446, commit d87deb22947873ff8b7a80bef719d2cf07c7f5fc
- EasyPrivacy https://easylist.to/easylist/easyprivacy.txt — version 202611080453, commit 363099b93e43778aba01e23c59f29827bc5d2f65
- Upstream licensing https://easylist.to/pages/licence.html

Dondai's build tool selects a limited subset of hostname-anchored network filters, translates supported resource types, scopes requests by party, excludes hosts with recognized exceptions and caps each ruleset. It does not reproduce the original lists' complete semantics. No Brave, AdBlocker Ultimate, or Opera engine code is included.
