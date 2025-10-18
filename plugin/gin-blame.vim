if exists('g:loaded_gin_blame')
  finish
endif
let g:loaded_gin_blame = 1

function! s:init_highlights() abort
  call gin#internal#util#highlight_inherit(
        \ 'GinBlameDivider',
        \ 'Comment',
        \ {'gui': 'strikethrough', 'cterm': 'strikethrough'}
        \ )
  sign define GinBlameDividerSign linehl=GinBlameDivider
endfunction

augroup gin_plugin_blame_internal
  autocmd!
  autocmd BufReadCmd ginblame://*
        \ call denops#request('gin', 'blame:edit', [bufnr(), expand('<amatch>')])
  autocmd BufReadCmd ginblamenav://*
        \ call denops#request('gin', 'blame:edit:nav', [bufnr(), expand('<amatch>')])
  autocmd ColorScheme * call s:init_highlights()
augroup END

function! s:command(bang, mods, args) abort
  if denops#plugin#wait('gin')
    return
  endif
  call denops#request('gin', 'blame:command', [a:bang, a:mods, a:args])
endfunction

command! -bang -bar -nargs=* GinBlame call s:command(<q-bang>, <q-mods>, [<f-args>])

call s:init_highlights()
