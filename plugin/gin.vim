if exists('g:loaded_gin')
  finish
endif
let g:loaded_gin = 1

augroup gin_plugin_internal
  autocmd!
  autocmd User GinCommandPre :
  autocmd User GinCommandPost :
augroup END

function! s:command(bang, args) abort
  if a:bang ==# '!'
    call denops#plugin#wait('gin')
    call denops#request('gin', 'command', [a:args])
  else
    let l:Callback = function('denops#notify', [
          \ 'gin',
          \ 'command',
          \ [a:args],
          \])
    call denops#plugin#wait_async('gin', l:Callback)
  endif
endfunction

command! -bang -bar -nargs=* Gin call s:command(<q-bang>, [<f-args>])
