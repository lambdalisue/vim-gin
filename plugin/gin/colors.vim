if exists('g:loaded_gin_colors')
  finish
endif
let g:loaded_gin_colors = 1

" Ref: https://github.com/w0ng/vim-hybrid
let s:terminal_ansi_colors = [
      \ '#282a2e',
      \ '#a54242',
      \ '#8c9440',
      \ '#de935f',
      \ '#5f819d',
      \ '#85678f',
      \ '#5e8d87',
      \ '#707880',
      \ '#373b41',
      \ '#cc6666',
      \ '#b5bd68',
      \ '#f0c674',
      \ '#81a2be',
      \ '#b294bb',
      \ '#8abeb7',
      \ '#c5c8c6',
      \]

if has('nvim')
  function! s:list_colors() abort
    return map(
          \ range(16),
          \ { _, v -> get(g:, printf('terminal_color_%d', v), s:terminal_ansi_colors[v]) },
          \)
  endfunction
else
  function! s:list_colors() abort
    return get(g:, 'terminal_ansi_colors', s:terminal_ansi_colors)
  endfunction
endif

function! s:define_highlight() abort
  let colors = s:list_colors()
  for i in range(16)
    execute printf(
          \ 'highlight default GinColor%d cterm=bold ctermfg=%d gui=bold guifg=%s',
          \ i,
          \ i,
          \ colors[i],
          \)
  endfor
endfunction

augroup gin_plugin_colors_define_highlight_internal
  autocmd! *
  autocmd ColorScheme * call s:define_highlight()
augroup END

call s:define_highlight()
