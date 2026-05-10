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
  autocmd User DenopsPluginPost:gin
        \ call denops#notify('gin', 'commit_split:try_cleanup', [])
augroup END

function! s:command(bang, mods, args) abort
  let args = filter(copy(a:args), { -> v:val !=# '++wait' })
  if index(a:args, '++wait') isnot# -1
    if denops#plugin#wait('gin')
      return
    endif
    call denops#request('gin', 'command', [a:mods, args])
  else
    let l:Callback = function('denops#notify', [
          \ 'gin',
          \ 'command',
          \ [a:mods, args],
          \])
    call denops#plugin#wait_async('gin', l:Callback)
  endif
endfunction

command! -bar -nargs=* Gin call s:command(<q-bang>, <q-mods>, [<f-args>])

function! s:buffer_command(bang, mods, args) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'buffer:command', [a:bang, a:mods, a:args])
endfunction

command! -bar -nargs=* GinBuffer call s:buffer_command(<q-bang>, <q-mods>, [<f-args>])
