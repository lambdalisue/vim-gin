if exists('g:loaded_gin_native')
  finish
endif
let g:loaded_gin_native = 1

augroup gin_plugin_native_internal
  autocmd!
  autocmd User GinNativeCommandPre :
  autocmd User GinNativeCommandPost :
augroup END

function! s:command(bang, ...) abort
  if a:bang ==# '!'
    call denops#plugin#wait('gin')
    call denops#request('gin', 'native:command', a:000)
  else
    let l:Callback = function('denops#notify', [
          \ 'gin',
          \ 'native:command',
          \ a:000,
          \])
    call denops#plugin#wait_async('gin', l:Callback)
  endif
endfunction

command! -bang -bar -nargs=* Gin call s:command(<q-bang>, <f-args>)
