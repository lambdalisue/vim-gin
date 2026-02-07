if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'gin_stash'

syntax clear

highlight default link GinStashRef Special
highlight default link GinStashType Title
highlight default link GinStashBranch Identifier
highlight default link GinStashHash Constant

syntax match GinStashRef /^stash@{\d\+}/
syntax match GinStashType /: \%(WIP on\|On\) /ms=s+2,me=e-1
syntax match GinStashBranch /\%(WIP on \|On \)\zs[^:]\+\ze:/
syntax match GinStashHash /: \zs[0-9a-f]\{7,\}\ze /
