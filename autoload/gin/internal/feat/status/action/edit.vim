function! gin#internal#feat#status#action#edit#register() abort
  noremap <buffer> <Plug>(gin-action-edit=)
        \ <Cmd>call gin#action#fn({ xs -> <SID>edit({ -> <SID>opener() }, '', xs) })<CR>
  map <buffer> <Plug>(gin-action-edit:edit) <Plug>(gin-action-edit=)edit<CR>
  map <buffer> <Plug>(gin-action-edit:split) <Plug>(gin-action-edit=)split<CR>
  map <buffer> <Plug>(gin-action-edit:vsplit) <Plug>(gin-action-edit=)vsplit<CR>
  map <buffer> <Plug>(gin-action-edit:tabedit) <Plug>(gin-action-edit=)tabedit<CR>
  map <buffer> <Plug>(gin-action-edit) <Plug>(gin-action-edit:edit)

  noremap <buffer> <Plug>(gin-action-edit:cached=)
        \ <Cmd>call gin#action#fn({ xs -> <SID>edit({ -> <SID>opener() }, '--cached', xs) })<CR>
  map <buffer> <Plug>(gin-action-edit:cached:edit) <Plug>(gin-action-edit:cached=)edit<CR>
  map <buffer> <Plug>(gin-action-edit:cached:split) <Plug>(gin-action-edit:cached=)split<CR>
  map <buffer> <Plug>(gin-action-edit:cached:vsplit) <Plug>(gin-action-edit:cached=)vsplit<CR>
  map <buffer> <Plug>(gin-action-edit:cached:tabedit) <Plug>(gin-action-edit:cached=)tabedit<CR>
  map <buffer> <Plug>(gin-action-edit:cached) <Plug>(gin-action-edit:cached:edit)

  noremap <buffer> <Plug>(gin-action-edit:HEAD=)
        \ <Cmd>call gin#action#fn({ xs -> <SID>edit({ -> <SID>opener() }, 'HEAD', xs) })<CR>
  map <buffer> <Plug>(gin-action-edit:HEAD:edit) <Plug>(gin-action-edit:HEAD=)edit<CR>
  map <buffer> <Plug>(gin-action-edit:HEAD:split) <Plug>(gin-action-edit:HEAD=)split<CR>
  map <buffer> <Plug>(gin-action-edit:HEAD:vsplit) <Plug>(gin-action-edit:HEAD=)vsplit<CR>
  map <buffer> <Plug>(gin-action-edit:HEAD:tabedit) <Plug>(gin-action-edit:HEAD=)tabedit<CR>
  map <buffer> <Plug>(gin-action-edit:HEAD) <Plug>(gin-action-edit:HEAD:edit)
endfunction

function! s:norm_xs(xs) abort
  call map(a:xs, { _, v -> v.value })
  call map(a:xs, { _, v -> escape(v, ' \\') })
endfunction

function! s:opener() abort
  let opener = input('Open with: ')
  redraw | echo ''
  if empty(opener)
    echohl WarningMsg
    echo 'Cancelled'
    echohl None
    return v:null
  endif
  return opener
endfunction

function! s:edit(opener, suffix, xs) abort
  let opener = a:opener()
  if opener is# v:null
    return
  endif
  call s:norm_xs(a:xs)
  call map(a:xs, { _, v -> execute(printf('%s | GinEdit %s %s', opener, a:suffix, v), '') })
endfunction
