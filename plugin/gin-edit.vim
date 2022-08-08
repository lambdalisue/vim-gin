if exists('g:loaded_gin_edit')
  finish
endif
let g:loaded_gin_edit = 1

augroup gin_plugin_edit_internal
  autocmd!
  autocmd BufReadCmd ginedit://*
        \ call denops#request('gin', 'edit:edit', [bufnr(), expand('<amatch>')])
  autocmd FileReadCmd ginedit://*
        \ call denops#request('gin', 'edit:read', [bufnr(), expand('<amatch>')])
augroup END

function! s:command(bang, mods, args) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'edit:command', [a:bang, a:mods, a:args])
endfunction

command! -bang -bar -nargs=* GinEdit call s:command(<q-bang>, <q-mods>, [<f-args>])
