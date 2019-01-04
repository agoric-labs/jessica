#ifndef _JSEPTR_H
#define _JSEPTR_H 1
// For situations where floating-point performance is not needed,
// we don't have an object table, and we add a header to 16-bit-aligned
// pointers, tagging integers in the low bit.

#ifndef JSE_PTR_T
#define JSE_PTR_T void *
#endif
typedef JSE_PTR_T JSE;

#define JSESTATE_OBJTABLE 0
typedef struct _JSEObjHeader {
    JSE _vtable;
    size_t alloced;
} JSEObjHeader;

#define JSEState JSEPtrState
#include "_jsestate.h"
#endif /* _JSEPTR_H */
