function! gin#internal#feat#status#action#register() abort
  call gin#internal#feat#status#action#edit#register()
  call gin#internal#feat#status#action#diff#register()

  noremap <buffer> <Plug>(gin-action-chaperon:supplements)
        \ <Cmd>call gin#action#fn({ xs -> <SID>chaperon('', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-chaperon:supplements:theirs)
        \ <Cmd>call gin#action#fn({ xs -> <SID>chaperon('--without-ours', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-chaperon:supplements:ours)
        \ <Cmd>call gin#action#fn({ xs -> <SID>chaperon('--without-theirs', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-chaperon:nosupplements)
        \ <Cmd>call gin#action#fn({ xs -> <SID>chaperon('--without-supplements', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-chaperon:nosupplements:theirs)
        \ <Cmd>call gin#action#fn({ xs -> <SID>chaperon('--without-supplements --without-ours', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-chaperon:nosupplements:ours)
        \ <Cmd>call gin#action#fn({ xs -> <SID>chaperon('--without-supplements --without-theirs', xs) })<CR>
  map <buffer> <Plug>(gin-action-chaperon) <Plug>(gin-action-chaperon:supplements)
  map <buffer> <Plug>(gin-action-chaperon:theirs) <Plug>(gin-action-chaperon:supplements:theirs)
  map <buffer> <Plug>(gin-action-chaperon:ours) <Plug>(gin-action-chaperon:supplements:ours)


  noremap <buffer> <Plug>(gin-action-patch)
        \ <Cmd>call gin#action#fn({ xs -> <SID>patch('', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-patch:head)
        \ <Cmd>call gin#action#fn({ xs -> <SID>patch('--without-worktree', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-patch:worktree)
        \ <Cmd>call gin#action#fn({ xs -> <SID>patch('--without-head', xs) })<CR>

  noremap <buffer> <Plug>(gin-action-add)
        \ <Cmd>call gin#action#fn({ xs -> <SID>add('', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-add:intent-to-add)
        \ <Cmd>call gin#action#fn({ xs -> <SID>add('--intent-to-add', xs) })<CR>

  noremap <buffer> <Plug>(gin-action-rm)
        \ <Cmd>call gin#action#fn({ xs -> <SID>rm('', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-rm:force)
        \ <Cmd>call gin#action#fn({ xs -> <SID>rm('--force', xs) })<CR>

  noremap <buffer> <Plug>(gin-action-reset)
        \ <Cmd>call gin#action#fn({ xs -> <SID>reset(xs) })<CR>

  noremap <buffer> <Plug>(gin-action-restore)
        \ <Cmd>call gin#action#fn({ xs -> <SID>restore('--ignore-unmerged', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-restore:staged)
        \ <Cmd>call gin#action#fn({ xs -> <SID>restore('--ignore-unmerged --staged', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-restore:ours)
        \ <Cmd>call gin#action#fn({ xs -> <SID>restore('--ignore-unmerged --ours', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-restore:theirs)
        \ <Cmd>call gin#action#fn({ xs -> <SID>restore('--ignore-unmerged --theirs', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-restore:conflict:merge)
        \ <Cmd>call gin#action#fn({ xs -> <SID>restore('--conflict=merge', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-restore:conflict:diff3)
        \ <Cmd>call gin#action#fn({ xs -> <SID>restore('--conflict=diff3', xs) })<CR>
  map <buffer> <Plug>(gin-action-restore:conflict) <Plug>(gin-action-restore:conflict:merge)

  noremap <buffer> <Plug>(gin-action-stage)
        \ <Cmd>call gin#action#fn({ xs -> <SID>stage(xs) })<CR>
  map <buffer> <Plug>(gin-action-unstage) <Plug>(gin-action-reset)

  noremap <buffer> <Plug>(gin-action-stage:intent-to-add)
        \ <Cmd>call gin#action#fn({ xs -> <SID>stage_intent_to_add(xs) })<CR>
  noremap <buffer> <Plug>(gin-action-unstage:intent-to-add)
        \ <Cmd>call gin#action#fn({ xs -> <SID>unstage_intent_to_add(xs) })<CR>

  noremap <buffer> <Plug>(gin-action-stash)
        \ <Cmd>call gin#action#fn({ xs -> <SID>stash('', xs) })<CR>
  noremap <buffer> <Plug>(gin-action-stash:keep-index)
        \ <Cmd>call gin#action#fn({ xs -> <SID>stash('--keep-index', xs) })<CR>
endfunction

function! s:norm_xs(xs) abort
  call map(a:xs, { _, v -> v.value })
  call map(a:xs, { _, v -> escape(v, ' \\') })
endfunction

function! s:chaperon(suffix, xs) abort
  call s:norm_xs(a:xs)
  call map(a:xs, { _, v -> execute(printf('tabedit | GinChaperon %s %s', a:suffix, v), '') })
endfunction

function! s:patch(suffix, xs) abort
  call s:norm_xs(a:xs)
  call map(a:xs, { _, v -> execute(printf('tabedit | GinPatch %s %s', a:suffix, v), '') })
endfunction

function! s:add(suffix, xs) abort
  call s:norm_xs(a:xs)
  execute printf('Gin! add --ignore-errors --force %s -- %s', a:suffix, join(a:xs, ' '))
endfunction

function! s:rm(suffix, xs) abort
  call s:norm_xs(a:xs)
  execute printf('Gin! rm --quiet --ignore-unmatch --cached %s -- %s', a:suffix, join(a:xs, ' '))
endfunction

function! s:reset(xs) abort
  call s:norm_xs(a:xs)
  execute printf('Gin! reset --quiet -- %s', join(a:xs, ' '))
endfunction

function! s:restore(suffix, xs) abort
  call s:norm_xs(a:xs)
  execute printf('Gin! restore --quiet %s -- %s', a:suffix, join(a:xs, ' '))
endfunction

function! s:stage(xs) abort
  let xs_removed = filter(copy(a:xs), { _, v -> v.XY[1] ==# 'D' })
  if !empty(xs_removed)
    noautocmd call s:rm('', xs_removed)
  endif

  let xs_others = filter(a:xs, { _, v -> v.XY[1] !=# 'D' })
  if !empty(xs_others)
    noautocmd call s:add('', xs_others)
  endif

  doautocmd <nomodeline> User GinCommandPost
endfunction

function! s:stage_intent_to_add(xs) abort
  let xs_unknown = filter(copy(a:xs), { _, v -> v.XY ==# '??' })
  if !empty(xs_unknown)
    noautocmd call s:add('--intent-to-add', xs_unknown)
  endif

  let xs_removed = filter(copy(a:xs), { _, v -> v.XY[1] ==# 'D' })
  if !empty(xs_removed)
    noautocmd call s:rm('', xs_removed)
  endif

  let xs_others = filter(a:xs, { _, v -> v.XY !=# '??' && v.XY[1] !=# 'D' })
  if !empty(xs_others)
    noautocmd call s:add('', xs_others)
  endif

  doautocmd <nomodeline> User GinCommandPost
endfunction

function! s:unstage_intent_to_add(xs) abort
  let xs_added = filter(copy(a:xs), { _, v -> v.XY ==# 'A.' })
  if !empty(xs_added)
    noautocmd call s:reset(copy(xs_added))
    noautocmd call s:add('--intent-to-add', xs_added)
  endif

  let xs_others = filter(a:xs, { _, v -> v.XY !=# 'A.' })
  if !empty(xs_others)
    noautocmd call s:reset(xs_others)
  endif

  doautocmd <nomodeline> User GinCommandPost
endfunction

function! s:stash(suffix, xs) abort
  call s:norm_xs(a:xs)
  execute printf('Gin! stash push --all %s -- %s', a:suffix, join(a:xs, ' '))
endfunction
