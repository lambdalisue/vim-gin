if exists('g:loaded_gin_tag')
  finish
endif
let g:loaded_gin_tag = 1

augroup gin_plugin_tag_internal
  autocmd!
  autocmd BufReadCmd gintag://*
        \ call denops#request('gin', 'tag:edit', [bufnr(), expand('<amatch>')])
  autocmd FileReadCmd gintag://*
        \ call denops#request('gin', 'tag:read', [bufnr(), expand('<amatch>')])
augroup END

function! s:command(bang, mods, args) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'tag:command', [a:bang, a:mods, a:args])
endfunction

command! -bang -bar -nargs=* GinTag call s:command(<q-bang>, <q-mods>, [<f-args>])
