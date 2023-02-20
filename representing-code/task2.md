In js I would heavily rely on closures e.g.:

```js
function createObject() {
  let data = "hello";
  let number = 1;
  return {
    number: () => number,
    data: () => data,
    increment: () => {
      number++;
    },
    setData: (arg) => {
      data = arg;
    },
  };
}
```
