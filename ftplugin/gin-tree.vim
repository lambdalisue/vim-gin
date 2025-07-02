if exists('b:did_ftplugin')
  finish
endif
let b:did_ftplugin = 1

" Define tree action commands
command! -buffer -range GinTreeExpand
      \ call denops#request('gin', 'tree:action:expand', [bufnr(), [<line1>, <line2>]])

command! -buffer -range GinTreeCollapse
      \ call denops#request('gin', 'tree:action:collapse', [bufnr(), [<line1>, <line2>]])

command! -buffer -range GinTreeExpandOrEdit
      \ call denops#request('gin', 'tree:action:expandOrEdit', [bufnr(), [<line1>, <line2>]])

" Define <Plug> mappings
nnoremap <buffer><silent> <Plug>(gin-action-expand)
      \ :<C-u>call denops#request('gin', 'tree:action:expand', [bufnr(), [line('.'), line('.')]])<CR>
vnoremap <buffer><silent> <Plug>(gin-action-expand)
      \ :call denops#request('gin', 'tree:action:expand', [bufnr(), [line("'<"), line("'>")]])<CR>

nnoremap <buffer><silent> <Plug>(gin-action-collapse)
      \ :<C-u>call denops#request('gin', 'tree:action:collapse', [bufnr(), [line('.'), line('.')]])<CR>
vnoremap <buffer><silent> <Plug>(gin-action-collapse)
      \ :call denops#request('gin', 'tree:action:collapse', [bufnr(), [line("'<"), line("'>")]])<CR>

nnoremap <buffer><silent> <Plug>(gin-action-expand-or-edit)
      \ :<C-u>call denops#request('gin', 'tree:action:expandOrEdit', [bufnr(), [line('.'), line('.')]])<CR>
vnoremap <buffer><silent> <Plug>(gin-action-expand-or-edit)
      \ :call denops#request('gin', 'tree:action:expandOrEdit', [bufnr(), [line("'<"), line("'>")]])<CR>

" Set up default mappings if not disabled
if !get(g:, 'gin_tree_disable_default_mappings', 0)
  nmap <buffer><nowait> l <Plug>(gin-action-expand-or-edit)
  nmap <buffer><nowait> h <Plug>(gin-action-collapse)
  vmap <buffer><nowait> l <Plug>(gin-action-expand-or-edit)
  vmap <buffer><nowait> h <Plug>(gin-action-collapse)
endif

" Standard Gin action mappings
if exists('*gin#action#fn')
  nnoremap <buffer><silent> <Plug>(gin-action-choice)
        \ :<C-u>call gin#action#fn({ xs -> gin#action#choose(xs) })<CR>
  vnoremap <buffer><silent> <Plug>(gin-action-choice)
        \ :call gin#action#fn({ xs -> gin#action#choose(xs) })<CR>
  nnoremap <buffer><silent> <Plug>(gin-action-repeat)
        \ :<C-u>call gin#action#fn({ xs -> gin#action#repeat(xs) })<CR>
  vnoremap <buffer><silent> <Plug>(gin-action-repeat)
        \ :call gin#action#fn({ xs -> gin#action#repeat(xs) })<CR>
  nnoremap <buffer><silent> <Plug>(gin-action-help)
        \ :<C-u>call gin#action#help()<CR>
  vnoremap <buffer><silent> <Plug>(gin-action-help)
        \ :<C-u>call gin#action#help()<CR>

  if !get(g:, 'gin_tree_disable_default_mappings', 0)
    nmap <buffer><nowait> a <Plug>(gin-action-choice)
    nmap <buffer><nowait> . <Plug>(gin-action-repeat)
    nmap <buffer><nowait> ? <Plug>(gin-action-help)
    vmap <buffer><nowait> a <Plug>(gin-action-choice)
    vmap <buffer><nowait> . <Plug>(gin-action-repeat)
    vmap <buffer><nowait> ? <Plug>(gin-action-help)
  endif
endif

" Buffer settings
setlocal cursorline
setlocal nomodeline
setlocal noswapfile
setlocal nomodifiable
setlocal nowrap

" Save and restore compatibility options
let s:save_cpo = &cpo
set cpo&vim

let &cpo = s:save_cpo
unlet s:save_cpo