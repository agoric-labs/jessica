#include <jessica.h>
#include <stdlib.h>
#include <stdio.h>

int
main(int argc, char **argv) {
    JSEState js = calloc(sizeof(*js), 1);
    printf("Alloced %p\n", js);
    free(js);
    return 0;
}
