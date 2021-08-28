if exists('g:loaded_gin_core_action')
  finish
endif
let g:loaded_gin_core_action = 1

let s:range = v:null

function! GinCoreActionDo(name, id) abort range
  let l:range = s:range is# v:null ? [a:firstline, a:lastline] : s:range
  call denops#notify(a:name, a:id, [l:range])
endfunction

function! GinCoreActionCall(name, range) abort
  let l:range = s:range
  let s:range = copy(a:range)
  try
    call feedkeys(printf("\<Plug>(gin-action-%s)\<Ignore>", a:name), 'xt')
  finally
    let s:range = l:range
  endtry
endfunction
