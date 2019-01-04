#ifndef _JSENAN_H
# define _JSENAN_H 1

#include <stddef.h>

#ifndef JSE_NAN_T
#define JSE_NAN_T double
#endif
typedef JSE_NAN_T JSE;

// The technique used to tag double/floats is called "NaN-boxing".
// Essentially, IEEE-754 provides payload bits for Not-a-Number values,
// allowing to embed different bit patterns as part of a legitimate
// floating-point value.

#define JSESTATE_OBJTABLE 1
typedef struct _JSEObjHeader {
    JSE _vtable;
    void *body;
    size_t alloced;
} JSEObjHeader;

#define JSEState JSENanState
#include "_jsestate.h"
#endif /* _JSEDBL_H */
