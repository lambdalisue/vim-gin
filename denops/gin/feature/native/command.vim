if exists('g:loaded_gin_feature_native_command')
  finish
endif
let g:loaded_gin_feature_native_command = 1

function! GinFeatureNativeCommandReload(bufnr) abort
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
