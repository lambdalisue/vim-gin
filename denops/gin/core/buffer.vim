if exists('g:loaded_gin_core_buffer')
  finish
endif
let g:loaded_gin_core_buffer = 1

function! GinCoreBufferReplace(bufnr, repl) abort
  let modified = getbufvar(a:bufnr, '&modified')
  let modifiable = getbufvar(a:bufnr, '&modifiable')
  let foldmethod = getbufvar(a:bufnr, '&foldmethod')
  call setbufvar(a:bufnr, '&modifiable', 1)
  call setbufvar(a:bufnr, '&foldmethod', 'manual')
  call setbufline(a:bufnr, 1, a:repl)
  call deletebufline(a:bufnr, len(a:repl) + 1, '$')
  call setbufvar(a:bufnr, '&modified', modified)
  call setbufvar(a:bufnr, '&modifiable', modifiable)
  call setbufvar(a:bufnr, '&foldmethod', foldmethod)
endfunction

function! GinCoreBufferReload(bufnr) abort
  if bufnr('%') is# a:bufnr
    edit
    return
  endif
  let winid_saved = win_getid()
  let winid = bufwinid(a:bufnr)
  if winid is# -1
    return
  endif
  keepjumps keepalt call win_gotoid(winid)
  try
    edit
  finally
    keepjumps keepalt call win_gotoid(winid_saved)
  endtry
endfunction

function! GinCoreBufferConcreteRestore() abort
  if !exists('b:gin_core_buffer_concrete_cache')
    return
  endif
  call GinCoreBufferReplace(bufnr('%'), b:gin_core_buffer_concrete_cache.content)
  let &filetype = b:gin_core_buffer_concrete_cache.filetype
endfunction

function! GinCoreBufferConcreteStore() abort
  let b:gin_core_buffer_concrete_cache = {
        \ 'filetype': &filetype,
        \ 'content': getline(1, '$'),
        \}
endfunction
