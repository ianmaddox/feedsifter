# feedsifter
RSS/Atom feed filtering, as seen on feedsifter.com

Feedsifter is a simple feed filtering service which allows for whitelist and blacklist filtering of RSS feed entries with regular expressions support.

Example filter:
```
  sample
  free
  for.s
  -artichokes
```

The above filter would search for feed entries that contain both 'sample' and 'free'. It would also return any entry containing the words 'fords' or 'forts' due to regular expression matching. Adding a minus sign to the beginning of any filter line excludes any matching entry. Entries with the word artichokes are omitted.
