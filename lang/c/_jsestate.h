#define JSE_PASTE(a, b) a ## b
typedef struct JSE_PASTE(_, JSEState) {
    JSE *stack;
    size_t stackSize;
    size_t tos;
#if JSESTATE_OBJTABLE
    JSEObjHeader *objTable;
#endif
} *JSEState;

#define JSEState_new() 0

// Drop N values from top of stack.
// Pick Nth from stack.

// Push undefined on stack.
// Push null on stack.
// Push boolean on stack.
// Push integer on stack.
// Push double on stack.
// Push new byte array on stack.
// Push new string.
// Push new empty array object on stack.
// Push new empty object on stack.
// Read index operation.

// Get type of N stack.
// Convert N stack as integer.
// Convert N stack as boolean.
// Convert N stack as double.
// Convert N stack as byte array.
// Convert N stack as string.
// Convert N stack as object (vtable, self).
