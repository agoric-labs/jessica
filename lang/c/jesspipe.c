#include <jessica.h>
#include <stdlib.h>
#include <stdio.h>

int
main(int argc, char **argv) {
    JSEState js = calloc(sizeof(*js), 1);
    fprintf(stderr, "FIXME: Would do something, other than alloc %p\n", js);
    free(js);
    printf("1\n");
    return 0;
}
