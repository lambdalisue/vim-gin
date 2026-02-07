if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'gin_tag'

syntax clear

highlight default link GinTagHash Constant
highlight default link GinTagName Special
highlight default link GinTagDate Title
highlight default link GinTagSubject Comment

syntax match GinTagHash /^[0-9a-f]\{7,\}/ nextgroup=GinTagName skipwhite
syntax match GinTagName /\S\+/ contained nextgroup=GinTagDate skipwhite
syntax match GinTagDate /\d\{4\}-\d\{2\}-\d\{2\}/ contained nextgroup=GinTagSubject skipwhite
syntax match GinTagSubject /.*/ contained
