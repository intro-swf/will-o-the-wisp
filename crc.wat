(module
	(memory (import "env" "memory") 1)
	(global (export "digest32_CRC_init_space") i32 i32.const 1024)
	(global $crc_tables (mut i32) i32.const 0)
	(func (export "digest32_CRC_init") (param $ptr i32) (param $done i32)
		(local $i i32)
		(local $c i32)
		(local $k i32)
		(set_global $crc_tables (get_local $ptr))
		(if (get_local $done) (then return))
		(loop
			(set_local $c (get_local $i))
			(set_local $k (i32.const 0))
			(loop
				(set_local $c (select
					(i32.xor (i32.const 0xEDB88320) (i32.shr_u (get_local $c) (i32.const 1)))
					(i32.shr_u (get_local $c) (i32.const 1))
					(i32.and (get_local $c) (i32.const 1))
				))
				(i32.store (get_local $ptr) (get_local $c))
				(set_local $ptr (i32.add (get_local $ptr) (i32.const 4)))
				(br_if 0 (i32.lt_u (tee_local $i (i32.add (get_local $k) (i32.const 1))) (i32.const 8)))
			)
			(br_if 0 (i32.lt_u (tee_local $i (i32.add (get_local $i) (i32.const 1))) (i32.const 256)))
		)
	)
	(global (export "digest32_CRC_zero") i32 i32.const 0)
	(func (export "digest32_CRC") (param $crc i32) (param $ptr i32) (param $endPtr i32) (result i32)
		(set_local $crc (i32.xor (get_local $crc) (i32.const 0xffffffff)))
		(block
			(br_if 0 (i32.ge_u (get_local $ptr) (get_local $endPtr)))
			(loop
				(set_local $crc (i32.xor
					(i32.load
						(i32.add (get_local $crc_tables) (i32.shl
							(i32.and
								(i32.xor (get_local $crc) (i32.load8_u (get_local $ptr)))
								(i32.const 0xff)
							)
							(i32.const 2)
						))
					)
					(i32.shr_u (get_local $crc) (i32.const 8))
				))
				(set_local $ptr (i32.add (get_local $ptr) (i32.const 1)))
				(br_if 0 (i32.lt_u (tee_local $ptr (i32.add (get_local $ptr) (i32.const 1))) (get_local $endPtr)))
			)
		)
		(i32.xor (get_local $crc) (i32.const 0xffffffff))
	)
)
