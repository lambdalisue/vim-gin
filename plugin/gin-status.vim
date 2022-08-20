if exists('g:loaded_gin_status')
  finish
endif
let g:loaded_gin_status = 1

augroup gin_plugin_status_internal
  autocmd!
  autocmd BufReadCmd ginstatus://*
        \ call denops#request('gin', 'status:edit', [bufnr(), expand('<amatch>')])
augroup END

function! s:command(bang, mods, args) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'status:command', [a:bang, a:mods, a:args])
endfunction

command! -bang -bar -nargs=* GinStatus call s:command(<q-bang>, <q-mods>, [<f-args>])
