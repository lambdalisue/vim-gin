if exists('b:current_syntax')
  finish
endif
let b:current_syntax = 'gin-branch'

highlight default link GinBranchNormal GinColor7
highlight default link GinBranchActive GinColor2
highlight default link GinBranchRemote GinColor1
highlight default link GinBranchCommit GinColor8
highlight default link GinBranchTracking GinColor4
highlight default link GinBranchMessage GinColor7
highlight link GinBranchCommitWithTracking GinBranchCommit
highlight link GinBranchCommitWithoutTracking GinBranchCommit

syntax clear
syntax match GinBranchNormalLine /^\s\{2}.*/ display contains=GinBranchNormal
syntax match GinBranchActiveLine /^\* .*/ display contains=GinBranchActive
syntax match GinBranchRemoteLine /^\s\{2}remotes\/.*/ display contains=GinBranchRemote

syntax match GinBranchNormal /^\s\{2}\zs\%((.\{-})\|\S\)\+/ contained nextgroup=GinBranchCommitWithTracking skipwhite
syntax match GinBranchActive /^\* \zs\%((.\{-})\|\S\)\+/ contained nextgroup=GinBranchCommitWithTracking skipwhite
syntax match GinBranchRemote /^\s\{2}\zsremotes\/\S\+/ contained nextgroup=GinBranchCommitWithoutTracking skipwhite
syntax match GinBranchCommitWithTracking /[a-f0-9]\+\ze/ contained nextgroup=GinBranchTracking skipwhite
syntax match GinBranchCommitWithoutTracking /[a-f0-9]\+\ze/ contained nextgroup=GinBranchMessage skipwhite
syntax match GinBranchTracking /\[\S\+\ze\%(: [^\]]\+\)\?\]/hs=s+1 contained nextgroup=GinBranchMessage skipwhite
syntax match GinBranchMessage /.*/ contained
