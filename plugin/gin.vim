if exists('g:loaded_gin')
  finish
endif
let g:loaded_gin = 1

augroup gin_plugin_internal
  autocmd!
  autocmd User GinCommandPost :
  autocmd User GinComponentPost :
augroup END

function! s:echo_command(bang, mods, args) abort
  if a:bang ==# '!'
    if denops#plugin#wait('gin')
      return
    endif
    call denops#request('gin', 'echo:command', [a:mods, a:args])
  else
    let l:Callback = function('denops#notify', [
          \ 'gin',
          \ 'echo:command',
          \ [a:mods, a:args],
          \])
    call denops#plugin#wait_async('gin', l:Callback)
  endif
endfunction

command! -bang -bar -nargs=* Gin call s:echo_command(<q-bang>, <q-mods>, [<f-args>])
command! -bang -bar -nargs=* GinEcho call s:echo_command(<q-bang>, <q-mods>, [<f-args>])
