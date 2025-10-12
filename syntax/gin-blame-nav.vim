if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'gin_blame_nav'

syntax clear

highlight link GinBlameLineNumber LineNr
highlight GinBlameTime guifg=#87afaf ctermfg=109 gui=NONE cterm=NONE
highlight GinBlameAuthor guifg=#ffaf5f ctermfg=215 gui=bold cterm=bold
highlight link GinBlameSummary Normal

syntax match GinBlameLineNumber
      \ /\v^\s*\d+/
      \ containedin=ALLBUT,GinBlameLineNumber
      \ nextgroup=GinBlameTime skipwhite

syntax match GinBlameTime
      \ /\v(just now|in \d+ \w+|\d+ \w+ ago)\t/
      \ contained
      \ nextgroup=GinBlameAuthor

syntax match GinBlameAuthor
      \ /\v[^\t]+\t/
      \ contained
      \ nextgroup=GinBlameSummary

syntax match GinBlameSummary
      \ /\v.+$/
      \ contained
