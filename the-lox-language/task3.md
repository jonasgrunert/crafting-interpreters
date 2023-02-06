Arrays / Lists can be implemented in Userland but are nice in Standard Library.
Binary data can be done with base64 encoded strings, but that sucks.
Aynchronous programming models either threads or promises as it is currently blocking.
File splitting aka requirring another file to not have a single file for every project.

Solution

The big ones are:

- Lists/arrays. You can build your own linked lists, but there's no way to create a data structure that stores a contiguous series of values that can be accessed in constant time in user code. That has to be baked into the language or core library.
- Some mechanism for handling runtime errors along the lines of exception handling.

Also:

- No break or continue for loops.
- No switch.
