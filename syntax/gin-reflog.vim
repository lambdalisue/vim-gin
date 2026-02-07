if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'gin_reflog'

syntax clear

highlight default link GinReflogHash Constant
highlight default link GinReflogSelector Special
highlight default link GinReflogAction Title
highlight default link GinReflogDeco Identifier

syntax match GinReflogHash /^[0-9a-f]\{7,\}/ nextgroup=GinReflogDeco,GinReflogSelector skipwhite
syntax match GinReflogDeco /([^)]*)/ contained nextgroup=GinReflogSelector skipwhite
syntax match GinReflogSelector /\S\+@{\d\+}/ contained nextgroup=GinReflogAction
syntax match GinReflogAction /: \zs[^:]\+\ze:/ contained
