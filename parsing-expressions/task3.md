We need to establish a bunch of new rules at the highest precedence to catch them
They are basically only updated error productions along those lines at the primary level

```
| ( "!=" | "==" ) equality
| ( ">" | ">=" | "<" | "<=" ) comparison
| ( "+" ) term
| ( "/" | "\*" ) factor ;
```
