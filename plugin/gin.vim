if exists('g:loaded_gin')
  finish
endif
let g:loaded_gin = 1

augroup gin_plugin_internal
  autocmd!
  autocmd User GinCommandPost :
  autocmd User GinComponentPost :
  autocmd BufReadCmd gin://*
        \ call denops#request('gin', 'buffer:edit', [bufnr(), expand('<amatch>')])
  autocmd FileReadCmd gin://*
        \ call denops#request('gin', 'buffer:read', [bufnr(), expand('<amatch>')])
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

function! s:buffer_command(...) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'buffer:command', a:000)
endfunction

command! -bar -nargs=* GinBuffer call s:buffer_command(<q-mods>, <f-args>)
