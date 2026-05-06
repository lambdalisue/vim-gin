function! gin#internal#util#cursor_restore#enable() abort
  augroup gin_internal_util_cursor_restore
    autocmd! * <buffer>
    autocmd BufWinLeave <buffer> call s:store()
    autocmd BufWinEnter <buffer> call timer_start(0, { -> s:restore() })
  augroup END
endfunction

function! s:store() abort
  let w:gin_cursor_restore = getcurpos()
endfunction

function! s:restore() abort
  if exists('w:gin_cursor_restore')
    call setpos('.', w:gin_cursor_restore)
  endif
endfunction
