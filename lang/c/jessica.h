#ifndef _JESSICA_H
# define _JESSICA_H 1
#include <config.h>/* The word, or double-word as the case may be. */

#if defined(JSE_NAN_T)
# include <jsenan.h>
#elif defined(JSE_PTR_T)
# include <jseptr.h>
#else
# error "You must specify the type of JSE"
#endif
#endif /* _JESSICA_H */
