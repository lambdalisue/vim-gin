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
syntax match GinStatusUntracked /^??/
syntax match GinStatusIgnored /^!!/
syntax match GinStatusConflicted /^\%(DD\|AU\|UD\|UA\|DU\|AA\|UU\)/
syntax match GinStatusStateX /^[ MADRC]/ nextgroup=GinStatusStateY
syntax match GinStatusStateY /[ MADRC]/ contained
syntax match GinStatusLocal /\%1l## [^\.]\+/hs=s+3 nextgroup=GinStatusRemote,GinStatusUpstream
syntax match GinStatusRemote /\.\.\.\S\+/hs=s+3
syntax match GinStatusUpstream /+\d\+/ nextgroup=GinStatusDownstream
syntax match GinStatusDownstream /-\d\+/
