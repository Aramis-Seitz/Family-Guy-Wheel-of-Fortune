# Regular Expressions

## Kommentare entfernen

### Ganze Kommentarzeilen löschen:

```
^[ \t]*\/\/.*\r?\n|^[ \t]*\/\*[\s\S]*?\*\/[ \t]*\r?\n
```

### Kommentare löschen, die in einer Zeile zusammen mit Code stehen:

```
(?<=^|[ \t])\/\/.*$|(?<=^|[ \t])\/\*[\s\S]*?\*\/` oder `(^[ \t]*|[ \t]+)\/\/.*$|(^[ \t]*|[ \t]+)\/\*[\s\S]*?\*\/
```

### Beide Expressions mit `|` kombiniert:

```
^[ \t]*\/\/.*\r?\n|^[ \t]*\/\*[\s\S]*?\*\/[ \t]*\r?\n|(?<=^|[ \t])\/\/.*$|(?<=^|[ \t])\/\*[\s\S]*?\*\/
```