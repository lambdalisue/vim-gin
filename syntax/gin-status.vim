if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'gin-status'

highlight default link GinStatusStateX GinColor2
highlight default link GinStatusStateY GinColor1
highlight default link GinStatusUntracked GinColor1
highlight default link GinStatusIgnored GinColor7
highlight default link GinStatusConflicted GinColor11
highlight default link GinStatusLocal GinColor2
highlight default link GinStatusRemote GinColor1
highlight default link GinStatusUpstream GinColor10
highlight default link GinStatusDownstream GinColor9

syntax clear
syntax match GinStatusState /^../ display transparent oneline
syntax match GinStatusUntracked /??/ containedin=GinStatusState
syntax match GinStatusIgnored /!!/ containedin=GinStatusState
syntax match GinStatusConflicted /\%(DD\|AU\|UD\|UA\|DU\|AA\|UU\)/ containedin=GinStatusState
syntax match GinStatusStateX /[ MADRC]/ containedin=GinStatusState nextgroup=GinStatusStateY
syntax match GinStatusStateY /[ MADRC]/ contained
syntax match GinStatusHeader /\%1l/ display transparent oneline
syntax match GinStatusLocal /## [^\.]\+/hs=s+3 containedin=GinStatusHeader nextgroup=GinStatusRemote,GinStatusUpstream
syntax match GinStatusRemote /\.\.\.\S\+/hs=s+3 containedin=GinStatusHeader
syntax match GinStatusUpstream /+\d\+/ containedin=GinStatusHeader nextgroup=GinStatusDownstream
syntax match GinStatusDownstream /-\d\+/ containedin=GinStatusHeader
