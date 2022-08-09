function! gin#internal#feat#status#action#diff#register() abort
  noremap <buffer> <Plug>(gin-action-diff:local=)
        \ <Cmd>call gin#action#fn({ xs -> <SID>diff({ -> <SID>opener() }, '', xs) })<CR>
  map <buffer> <Plug>(gin-action-diff:local:edit) <Plug>(gin-action-diff:local=)edit<CR>
  map <buffer> <Plug>(gin-action-diff:local:split) <Plug>(gin-action-diff:local=)split<CR>
  map <buffer> <Plug>(gin-action-diff:local:vsplit) <Plug>(gin-action-diff:local=)vsplit<CR>
  map <buffer> <Plug>(gin-action-diff:local:tabedit) <Plug>(gin-action-diff:local=)tabedit<CR>
  map <buffer> <Plug>(gin-action-diff:local) <Plug>(gin-action-diff:local:edit)

  noremap <buffer> <Plug>(gin-action-diff:cached=)
        \ <Cmd>call gin#action#fn({ xs -> <SID>diff({ -> <SID>opener() }, '--cached', xs) })<CR>
  map <buffer> <Plug>(gin-action-diff:cached:edit) <Plug>(gin-action-diff:cached=)edit<CR>
  map <buffer> <Plug>(gin-action-diff:cached:split) <Plug>(gin-action-diff:cached=)split<CR>
  map <buffer> <Plug>(gin-action-diff:cached:vsplit) <Plug>(gin-action-diff:cached=)vsplit<CR>
  map <buffer> <Plug>(gin-action-diff:cached:tabedit) <Plug>(gin-action-diff:cached=)tabedit<CR>
  map <buffer> <Plug>(gin-action-diff:cached) <Plug>(gin-action-diff:cached:edit)

  noremap <buffer> <Plug>(gin-action-diff:HEAD=)
        \ <Cmd>call gin#action#fn({ xs -> <SID>diff({ -> <SID>opener() }, 'HEAD', xs) })<CR>
  map <buffer> <Plug>(gin-action-diff:HEAD:edit) <Plug>(gin-action-diff:HEAD=)edit<CR>
  map <buffer> <Plug>(gin-action-diff:HEAD:split) <Plug>(gin-action-diff:HEAD=)split<CR>
  map <buffer> <Plug>(gin-action-diff:HEAD:vsplit) <Plug>(gin-action-diff:HEAD=)vsplit<CR>
  map <buffer> <Plug>(gin-action-diff:HEAD:tabedit) <Plug>(gin-action-diff:HEAD=)tabedit<CR>
  map <buffer> <Plug>(gin-action-diff:HEAD) <Plug>(gin-action-diff:HEAD:edit)

  noremap <buffer> <Plug>(gin-action-diff:smart=)
        \ <Cmd>call gin#action#fn({ xs -> <SID>diff_smart({ -> <SID>opener() }, xs) })<CR>
  map <buffer> <Plug>(gin-action-diff:smart:edit) <Plug>(gin-action-diff:smart=)edit<CR>
  map <buffer> <Plug>(gin-action-diff:smart:split) <Plug>(gin-action-diff:smart=)split<CR>
  map <buffer> <Plug>(gin-action-diff:smart:vsplit) <Plug>(gin-action-diff:smart=)vsplit<CR>
  map <buffer> <Plug>(gin-action-diff:smart:tabedit) <Plug>(gin-action-diff:smart=)tabedit<CR>
  map <buffer> <Plug>(gin-action-diff:smart) <Plug>(gin-action-diff:smart:edit)

  map <buffer> <Plug>(gin-action-diff=) <Plug>(gin-action-diff:smart=)
  map <buffer> <Plug>(gin-action-diff:edit) <Plug>(gin-action-diff:smart:edit)
  map <buffer> <Plug>(gin-action-diff:split) <Plug>(gin-action-diff:smart:split)
  map <buffer> <Plug>(gin-action-diff:vsplit) <Plug>(gin-action-diff:smart:vsplit)
  map <buffer> <Plug>(gin-action-diff:tabedit) <Plug>(gin-action-diff:smart:tabedit)
  map <buffer> <Plug>(gin-action-diff) <Plug>(gin-action-diff:smart)
endfunction

function! s:norm_xs(xs) abort
  call map(a:xs, { _, v -> v.value })
  call map(a:xs, { _, v -> escape(v, ' \\') })
endfunction

function! s:opener() abort
  return gin#internal#util#action#select_opener()
endfunction

function! s:diff(opener, suffix, xs) abort
  let opener = a:opener()
  if opener is# v:null
    return
  endif
  call s:norm_xs(a:xs)
  call map(a:xs, { _, v -> execute(printf('%s | GinDiff %s -- %s', opener, a:suffix, v), '') })
endfunction

function! s:diff_smart(opener, xs) abort
  let opener = a:opener()
  if opener is# v:null
    return
  endif

  let xs_local = filter(copy(a:xs), { _, v -> v.XY[0] ==# '.' })
  if !empty(xs_local)
    call s:diff({ -> opener }, '', xs_local)
  endif

  let xs_cached = filter(copy(a:xs), { _, v -> v.XY[0] !=# '.' })
  if !empty(xs_cached)
    call s:diff({ -> opener }, '--cached', xs_cached)
  endif
endfunction
